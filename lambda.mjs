import { exec } from 'child_process';
import { promisify } from 'util';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Convert exec to return a promise
const execAsync = promisify(exec);

export const handler = async (event, context) => {
    try {
        const params = JSON.parse(event.Records[0].body);
        
        // Validate URL parameter
        if (!params.url) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "URL parameter is required",
                    event: event
                })
            };
        }

        // Execute the command and wait for results
        const { stdout, stderr } = await execAsync(`node cli.js "${params.url}"`);

        if (stderr) {
            console.error('Command stderr:', stderr);
        }

        console.log(params.identifier, stdout)

        // Publish results to SNS
        console.log('TOPIC_ARN environment variable:', process.env.TOPIC_ARN);

        if (!process.env.TOPIC_ARN) {
            console.error('TOPIC_ARN environment variable is not set!');
            throw new Error('TOPIC_ARN environment variable is required');
        }

        // Extract region from Topic ARN (format: arn:aws:sns:REGION:ACCOUNT:TOPIC_NAME)
        const topicRegion = process.env.TOPIC_ARN.split(':')[3];
        console.log('Topic region:', topicRegion);

        // Initialize SNS client with the topic's region
        const snsClient = new SNSClient({ region: topicRegion });

        const publishCommand = new PublishCommand({
            TopicArn: process.env.TOPIC_ARN,
            Subject: params.url,
            Message: stdout
        });

        try {
            await snsClient.send(publishCommand);
        } catch(e) {
            if (e.name === "NotFoundException")
                console.error('Failed to publish messsage to Topic ' + process.env.TOPIC_ARN)
            throw e
        }
        console.log('Results published to SNS for URL:', params.url);

        return {
            statusCode: 200,
            body: stdout
        };

    } catch (error) {
        console.error('Error executing command:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};