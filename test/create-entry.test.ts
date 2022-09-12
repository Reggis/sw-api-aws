import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../lib/create-entry";
import 'aws-sdk-client-mock-jest';
import * as uuid from 'uuid';

jest.mock('uuid');

describe('Testing entry creation', () => {
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    ddbMock.on(PutCommand).resolves({});
    const characterName = "Obi Wan Kenobi";
    const episodes = ["NEWHOPE"];
    const tableName = 'Characters'
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

    test('should create new entry', async () => {
        jest.spyOn(uuid, 'v4').mockReturnValue(id);
        ddbMock.on(GetCommand).resolves({
            Item: { id, characterName, episodes }
        });
        const result = await handler({
            body: JSON.stringify({ characterName, episodes })
        } as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(PutCommand, { TableName: tableName, Item: { id, characterName, episodes } });
        expect(result.body).toStrictEqual(JSON.stringify({ id, characterName, episodes }))
    });

    test('should response with 400 on no name', async () => {
        const result = await handler({
            body: JSON.stringify({ episodes })
        } as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
    });

    test('should response with 400 on inproper episodes list', async () => {
        const result = await handler({
            body: JSON.stringify({ characterName, episodes: 'HOPE' })
        } as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
    });

    test('should response with 400 if character already exists', async () => {
        ddbMock.on(QueryCommand).resolves({
            Items: [{ characterName, episodes }],
            Count: 1
        });
        const result = await handler({
            body: JSON.stringify({ characterName, episodes })
        } as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(PutCommand);
    });

    test('should save with planet', async () => {
        const planet = "Stewjon";
        jest.spyOn(uuid, 'v4').mockReturnValue(id);
        ddbMock.on(GetCommand).resolves({
            Item: { id, characterName, episodes, planet }
        });
        const result = await handler({
            body: JSON.stringify({ characterName, episodes, planet })
        } as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(PutCommand, { TableName: tableName, Item: { id: id, characterName, episodes, planet } });
        expect(result.body).toStrictEqual(JSON.stringify({ id, characterName, episodes, planet }))
    });

})

