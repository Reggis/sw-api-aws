import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../lib/get-entry";
import 'aws-sdk-client-mock-jest';

describe('Testing entry get', () => {
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    const characterName = "Obi Wan Kenobi";
    const episodes = ["NEWHOPE"];
    const tableName = 'Characters';
    const id = 'test-id';


    jest.mock('@aws-sdk/lib-dynamodb', () => {
        return {
            DynamoDBDocumentClient: ddbMock
        }
    });

    beforeEach(() => {
        ddbMock.reset();
        jest.resetModules()
        process.env = { ...OLD_ENV };
        process.env['CHARACTERS_TABLE_NAME'] = tableName
    });
    afterAll(() => {
        process.env = OLD_ENV;
    });

    test('should response with character ', async () => {
        ddbMock.on(GetCommand).resolves({
            Item: { id, characterName, episodes }
        });
        const result = await handler({
            pathParameters: { id }
        } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
            TableName: tableName,
            Key: { id }
        });
        expect(result.body).toStrictEqual(JSON.stringify({ id, characterName, episodes }))
    });

    test('should response with 404 not found character', async () => {
        ddbMock.on(GetCommand).resolves({});
        const result = await handler({
            pathParameters: { "id": 'random-id' },
            body: JSON.stringify({ characterName })
        } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(404);
        expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
            TableName: tableName,
            Key: { id: 'random-id' }
        });
    });
})

