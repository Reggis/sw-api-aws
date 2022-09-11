import { DeleteCommand, DynamoDBDocumentClient, GetCommand, GetCommandOutput, PutCommand, QueryCommand, QueryCommandOutput, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ICreateCharacterRequest, IEditCharacterRequest } from '../interface/create-character-request.interface';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ICharacter } from "../interface/character.interface";

export class CharacterRepository {

    private ddb: DynamoDBDocumentClient;
    private tableName: string;

    constructor() {
        const dynamodb = new DynamoDBClient({});
        this.ddb = DynamoDBDocumentClient.from(dynamodb);
        this.tableName = process.env['CHARACTERS_TABLE_NAME']!;
    }

    public async getCharacterByName(eventBody: ICreateCharacterRequest) {
        return await this.ddb.send(new QueryCommand({
            TableName: this.tableName,
            IndexName: 'NameIndex',
            KeyConditionExpression: 'characterName = :charName',
            ExpressionAttributeValues: { ':charName': eventBody.characterName }
        }));
    }

    public async putCharacter(newCharacter: Partial<ICharacter>): Promise<void> {
        await this.ddb.send(
            new PutCommand({
                TableName: this.tableName,
                Item: newCharacter
            })
        );
    }

    public async getCharacterById(id: string): Promise<GetCommandOutput> {
        return await this.ddb.send(new GetCommand({
            TableName: this.tableName,
            Key: {id},
        }));
    }

    public async updateCharacter(eventBody: IEditCharacterRequest, id:string): Promise<void> {
        let updateExpression = '';
        const expressionAttributeValues: any = {};
        if(eventBody.episodes){
            updateExpression += "SET episodes = :episodes, ";
            expressionAttributeValues[':episodes'] = eventBody.episodes;
        }
        if(eventBody.characterName){
            updateExpression += "SET characterName = :name, ";
            expressionAttributeValues[':name'] = eventBody.characterName;
        }
        if(eventBody.planet){
            updateExpression += "SET planet = :planet, ";
            expressionAttributeValues[':planet'] = eventBody.planet;
        }

        if(updateExpression != ''){
            updateExpression = updateExpression.slice(0,-2);
            await this.ddb.send(
                new UpdateCommand({
                    TableName: this.tableName,
                    Key: {id},
                    UpdateExpression: updateExpression,
                    ExpressionAttributeValues: expressionAttributeValues
                })
            );
        }
    }

    public async removeCharacterById(id: string) {
        await this.ddb.send(
            new DeleteCommand({
                TableName: this.tableName,
                Key: {id}
            })
        );
    }

    public async getCharactersColletion(lastEvaluatedKey: string | undefined): Promise<QueryCommandOutput> {
        const queryCommand = new QueryCommand({TableName: this.tableName, Limit: 4});
        if(lastEvaluatedKey){
            queryCommand.input.ExclusiveStartKey = {'id': lastEvaluatedKey}
        }
        return await this.ddb.send(queryCommand)
    }
}

