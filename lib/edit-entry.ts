import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { parseEditCharacterInput } from './common/parsers';
import { CharacterRepository } from './repository/characterRepository';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const parseResult = parseEditCharacterInput(event);
    if (!parseResult.success) {
        return parseResult.error!;
    }
    const id = event!.pathParameters!['id'];
    const eventBody = parseResult.result!;
    const characterRepository = new CharacterRepository();

    const currentCharacter = await characterRepository.getCharacterById(id!);
    if (!currentCharacter.Item) {
        return {
            statusCode: 400,
            body: JSON.stringify('Bad request - character does not exists')
        }
    }
    await characterRepository.updateCharacter(eventBody, id!)
    const updatedCharacter = (await characterRepository.getCharacterById(id!)).Item;
    return {
        statusCode: 200,
        body: JSON.stringify(updatedCharacter)
    };
};