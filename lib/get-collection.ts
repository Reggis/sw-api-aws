import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { validateIdInPath } from './common/parsers';
import { CharacterRepository } from './repository/characterRepository';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const lastEvaluatedKey = event.queryStringParameters ? event.queryStringParameters['lastEvaluatedKey']: undefined;
    const characterRepository = new CharacterRepository();

    const collection = await characterRepository.getCharactersColletion(lastEvaluatedKey);
    return {
        statusCode: 200,
        body: JSON.stringify({'characters': collection.Items, 'lastEvaluatedKey': collection.LastEvaluatedKey})
    };
};