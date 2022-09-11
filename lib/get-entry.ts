import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { validateIdInPath } from './common/parsers';
import { CharacterRepository } from './repository/characterRepository';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const parseResult = validateIdInPath(event);
    if(!parseResult.success){
        return parseResult.error!;
    }
    const id = event!.pathParameters!['id'];
    const characterRepository = new CharacterRepository();

    const currentCharacter = await characterRepository.getCharacterById(id!);
    if(!currentCharacter.Item){
        return {
            statusCode: 404,
            body: JSON.stringify('Character does not exists')
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify(currentCharacter.Item)
    };
};