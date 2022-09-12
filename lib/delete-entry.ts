import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { validateIdInPath } from './common/parsers';
import { CharacterRepository } from './repository/characterRepository';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const parseResult = validateIdInPath(event);
    if (!parseResult.success) {
        return parseResult.error!;
    }
    const id = event!.pathParameters!['id'];

    const characterRepository = new CharacterRepository();

    const currentCharacter = await characterRepository.getCharacterById(id!);
    if (!currentCharacter?.Item) {
        return {
            statusCode: 400,
            body: JSON.stringify('Bad request - character not exists')
        }
    }
    await characterRepository.removeCharacterById(id!);


    return {
        statusCode: 200,
        body: JSON.stringify(''),
    };
};