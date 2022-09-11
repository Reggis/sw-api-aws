export interface IParsingResult<T> {
    success: boolean,
    error?: {
        statusCode: number,
        body: string
    }
    result?: T
}
export interface ICreateCharacterRequest {
    name: string;
    episodes: string[];
    planet?: string;
}

export interface IEditCharacterRequest {
    name?: string;
    episodes?: string[];
    planet?: string;
}

