# AWS SAM setup

When creating the SQS queue, consider the following:
- "Visibility timeout" should be higher or equal than Lambda's timeout (60 seconds)
- The SQS queue needs proper policies for the lambda function to be able to fetch items from it, you can use the following policy, make sure to replace ACCOUNT_ID with your AWS account ID and SQS_ARN with ARN of your queue.
{
"Version": "2012-10-17",
"Id": "__default_policy_ID",
"Statement": [
{
"Sid": "__owner_statement",
"Effect": "Allow",
"Principal": {
"AWS": "arn:aws:iam::ACCOUNT_ID:root"
},
"Action": "SQS:*",
"Resource": "SQS_ARN"
},
{
"Effect": "Allow",
"Principal": {
"Service": "lambda.amazonaws.com"
},
"Action": "sqs:ReceiveMessage",
"Resource": "SQS_ARN"
},
{
"Effect": "Allow",
"Principal": {
"Service": "lambda.amazonaws.com"
},
"Action": [
"sqs:DeleteMessage",
"sqs:GetQueueAttributes",
"sqs:GetQueueUrl"
],
"Resource": "SQS_ARN"
}
]
}

to build:
sam build



to test locally:
sam local invoke WappalyzerFunction -e events/event.json



to deploy:
sam deploy --guided



after deploying, once you push a new message to the queue, the lambda function runs and the output could be found in cloudwatch
