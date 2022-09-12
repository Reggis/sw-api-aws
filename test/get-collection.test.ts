import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../lib/get-collection";
import 'aws-sdk-client-mock-jest';

describe('Testing entry get', () => {
    const OLD_ENV = process.env;
    const ddbMock = mockClient(DynamoDBDocumentClient);
    const name = "Obi Wan Kenobi";
    const episodes = ["NEWHOPE"];
    const tableName = 'Characters';
    const id = 'test-id';

    const collection = [
        [
            {
                "id": "1",
                "characterName": "Luke Skywalker",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "2",
                "characterName": "Darth Vader",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "3",
                "characterName": "Han Solo",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "4",
                "characterName": "Leia Organa",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"],
                "planet": "Alderaan"
            }
        ],
        [
            {
                "id": "5",
                "characterName": "Wilhuff Tarkin",
                "episodes": ["NEWHOPE"]
            },
            {
                "id": "6",
                "characterName": "C-3PO",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            },
            {
                "id": "7",
                "characterName": "R2-D2",
                "episodes": ["NEWHOPE", "EMPIRE", "JEDI"]
            }
        ]
    ]

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

    test('should response with collection ', async () => {
        ddbMock.on(ScanCommand).resolves({
            Items: collection[0],
            LastEvaluatedKey: { id: collection[0][3].id }
        });
        const result = await handler({} as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(ScanCommand, {
            TableName: tableName,
            Limit: 4
        });
        expect(JSON.parse(result.body)).toStrictEqual({ "characters": collection[0], "lastEvaluatedKey": { id: collection[0][3].id } })
    });

    test('should response with next records if lastEvaluatedKey passed', async () => {
        ddbMock.on(ScanCommand).resolves({
            Items: collection[1],
            LastEvaluatedKey: { id: collection[1][2].id }
        });
        const result = await handler({ queryStringParameters: { 'lastEvaluatedKey': collection[0][3].id } } as unknown as APIGatewayProxyEvent, {} as Context);
        expect(result.statusCode).toStrictEqual(200);
        expect(ddbMock).toHaveReceivedCommandWith(ScanCommand, {
            TableName: tableName,
            ExclusiveStartKey: { id: collection[0][3].id },
            Limit: 4
        });
        expect(JSON.parse(result.body)).toStrictEqual({ "characters": collection[1], "lastEvaluatedKey": { id: collection[1][2].id } })
    });
})

