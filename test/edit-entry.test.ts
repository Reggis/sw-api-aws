import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb"; 
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {handler} from "../lib/edit-entry";
import 'aws-sdk-client-mock-jest';

describe('Testing entry edit', () =>{
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    const oldName = "Obi Wan Kenobi";
    const name = "Obi Wan Kenobi II";
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

    test('should edit properties of existing entry', async () =>{
        ddbMock.on(GetCommand).resolvesOnce({
            Item: {id, name: oldName, episodes}
        }).resolvesOnce({Item: {id, name, episodes}});
        const result = await handler({
            pathParameters: {id},
            body: JSON.stringify({name})
        } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, {
            TableName: tableName,
            Key: {id}, 
            UpdateExpression: "SET name = :name",
            ExpressionAttributeValues: {":name": name}});
        expect(result.body).toStrictEqual(JSON.stringify({id, name, episodes}))
    });

    test('should response with 400 not found character', async () =>{
        ddbMock.on(GetCommand).resolves({});
        const result = await  handler({
            pathParameters: {"id":'random-id'},
            body: JSON.stringify({name})
        } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(400);
        expect(ddbMock).not.toHaveReceivedCommand(UpdateCommand);
    });

    test('should do nothing with unknown properties', async () =>{
        ddbMock.on(GetCommand).resolves({
            Item: {id, name: oldName, episodes}
        });
        const result = await handler({
            pathParameters: {id},
            body: JSON.stringify({"hasBeard": true})
        } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).not.toHaveReceivedCommand(UpdateCommand);
        expect(result.body).toStrictEqual(JSON.stringify({id, name: oldName, episodes}))
    });
})

