import { APIGatewayEvent } from 'aws-lambda';
import { ICreateCharacterRequest, IEditCharacterRequest, IParsingResult } from '../interface/create-character-request.interface';

export const validateIdInPath = (event: APIGatewayEvent): IParsingResult<null> => {
    if(!event?.pathParameters || !event?.pathParameters['id']){
        return {
            success: false,
            error: {
                statusCode: 400,
                body: JSON.stringify('No id in the path')
            }
        }
    }
    return {success:true}
};

export const parseEditCharacterInput = (event: APIGatewayEvent): IParsingResult<IEditCharacterRequest> => {
    const idInPath = validateIdInPath(event);
    if(!idInPath.success){
        return {success: false, error: idInPath.error};
    }
    const eventBodyParsingResult = validateEventBody<IEditCharacterRequest>(event);
    return eventBodyParsingResult;
};

const validateEventBody = <T>(event: APIGatewayEvent): IParsingResult<T> => {
    let eventBody: T;
    if (!event.body) {
        return {
            success: false,
            error: {
                statusCode: 400,
                body: JSON.stringify('Inproper body')
            }
        };
    }

    try {
        eventBody = <T>JSON.parse(event.body!);
    } catch (e) {
        return {
            success: false,
            error: {
                statusCode: 400,
                body: JSON.stringify('Body is not a valid JSON')
            }
        };
    }
    return {success:true, result: eventBody}
}

export const parseCreateCharacterInput = (event: APIGatewayEvent): IParsingResult<ICreateCharacterRequest> => {
    const eventBodyParsingResult = validateEventBody<ICreateCharacterRequest>(event);
    if(!eventBodyParsingResult.success){
        return eventBodyParsingResult;
    }
    const eventBody = eventBodyParsingResult.result!;
    if (!eventBody.name) {
        return {
            success: false,
            error: {
                statusCode: 400,
                body: JSON.stringify('Bad request - missing name')
            }
        };
    }

    if (!eventBody.episodes || !Array.isArray(eventBody.episodes)) {
        return {
            success: false,
            error: {
                statusCode: 400,
                body: JSON.stringify('Bad request - missing episodes')
            }
        };
    }
    return { success: true, result: eventBody };
};
