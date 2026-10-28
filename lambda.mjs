import { execFile } from 'child_process';
import { promisify } from 'util';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Convert execFile to return a promise (no shell involved)
const execFileAsync = promisify(execFile);

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

        // Only allow well-formed http(s) URLs
        let parsed;
        try {
            parsed = new URL(params.url);
        } catch (e) {
            parsed = null;
        }
        if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Invalid URL",
                    event: event
                })
            };
        }

        // Execute the command and wait for results
        const { stdout, stderr } = await execFileAsync('node', ['cli.js', parsed.href], { maxBuffer: 10 * 1024 * 1024 });

        if (stderr) {
            console.error('Command stderr:', stderr);
        }

        console.log(params.identifier, stdout)

        // SNS caps messages at 256 KB; the consumer only needs technology names
        const results = JSON.parse(stdout);
        const message = JSON.stringify({
            technologies: (results.technologies || []).map(({ name }) => ({ name }))
        });

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
            Message: message
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
            body: message
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