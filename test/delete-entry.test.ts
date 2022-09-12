import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../lib/delete-entry";
import 'aws-sdk-client-mock-jest';

describe('Testing entry deletion', () => {
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    ddbMock.on(DeleteCommand).resolves({});
    const id = 'test-id'
    const tableName = 'Characters'

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

    test('should remove entry', async () => {
        const name = "Obi Wan Kenobi";
        const episodes = ["NEWHOPE"];
        ddbMock.on(GetCommand).resolves({
            Item: [{ name, episodes }]
        });
        const result = await handler({ pathParameters: { id } } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(DeleteCommand, { TableName: 'Characters', Key: { id } });
    });

    test('should response with 400 on no id', async () => {
        const result = await handler({ pathParameters: { "notId": id } } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(DeleteCommand);
    });

    test('should response with 400 is character does not exists', async () => {
        ddbMock.on(GetCommand).resolves({});
        const result = await handler({ pathParameters: { id } } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(DeleteCommand);
    });
})

