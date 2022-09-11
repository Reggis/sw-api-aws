export interface IParsingResult<T> {
    success: boolean,
    error?: {
        statusCode: number,
        body: string
    }
    result?: T
}
export interface ICreateCharacterRequest {
    characterName: string;
    episodes: string[];
    planet?: string;
}

export interface IEditCharacterRequest {
    characterName?: string;
    episodes?: string[];
    planet?: string;
}

