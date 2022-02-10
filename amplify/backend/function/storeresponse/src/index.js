/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_RESPOSES_ARN
	STORAGE_RESPOSES_NAME
	STORAGE_RESPOSES_STREAMARN
Amplify Params - DO NOT EDIT */


const AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();
var responsesTableName = process.env.STORAGE_RESPOSES_NAME;


exports.handler = async (event) => {


    var jsonBody = JSON.parse(event.body);
    var text = jsonBody.text;
    var predominant = jsonBody.predominant;
    var mixed = jsonBody.mixed;
    var negative = jsonBody.negative;
    var neutral = jsonBody.neutral;
    var positive = jsonBody.positive;

    var params = {
        TableName: responsesTableName,
        Item:{
        text: text,
        predominant: predominant,
        mixed: mixed,
        negative: negative,
        neutral: neutral,
        positive: positive
        }
    };
    
    //Add timestamp
    //Add survey


    try {
        var result = await docClient.put(params).promise();
    } catch (error) {
        console.error(error);
    }


    const response = {
        statusCode: 200,
     headers: {
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "*"
     }, 
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
