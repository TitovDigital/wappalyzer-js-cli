import { exec } from 'child_process';
import { promisify } from 'util';

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

        const responseJson = JSON.stringify({
          output: stdout
        })

        console.log(params.identifier, stdout)

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