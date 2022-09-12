import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { ICharacter } from './interface/character.interface';
import { parseCreateCharacterInput } from './common/parsers';
import * as uuid from 'uuid';
import { CharacterRepository } from './repository/characterRepository';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const parseResult = parseCreateCharacterInput(event);
    if (!parseResult.success) {
        return parseResult.error!;
    }
    const eventBody = parseResult.result!;
    const characterRepository = new CharacterRepository();

    const currentCharacters = await characterRepository.getCharacterByName(eventBody);
    if (currentCharacters?.Count) {
        return {
            statusCode: 400,
            body: JSON.stringify('Bad request - character already exists')
        }
    }

    const id = uuid.v4()
    const newCharacter: Partial<ICharacter> = {
        'id': id,
        'characterName': eventBody.characterName,
        'episodes': eventBody.episodes
    }

    if (eventBody.planet) {
        newCharacter.planet = eventBody.planet;
    }

    await characterRepository.putCharacter(newCharacter);

    const updatedCharacter = (await characterRepository.getCharacterById(id!)).Item;
    return {
        statusCode: 200,
        body: JSON.stringify(updatedCharacter)
    };
};




