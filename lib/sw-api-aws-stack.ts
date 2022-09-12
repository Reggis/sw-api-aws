import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Model } from 'aws-cdk-lib/aws-apigateway';

export class SwApiAwsStack extends cdk.Stack {
  private defaultLambdaEnv: { [key: string]: string } = {};
  private charactersTable: Table;
  private restApi: apigw.RestApi;
  private apiModels: { [key: string]: Model };

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createCharactersTable();
    this.createRestApi();
    this.createApiModels();
    this.createRestApiEndpoints();

  }

  private createApiModels() {
    this.apiModels = {};
    this.apiModels['BareStringResponseModel'] = this.restApi.addModel('BareStringResponseModel', {
      contentType: 'application/json',
      modelName: 'BareStringResponseModel',
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        type: apigw.JsonSchemaType.STRING,
      }
    });

    this.apiModels['CharacterResponseModel'] = this.restApi.addModel('CharacterResponseModel', {
      contentType: 'application/json',
      modelName: 'CharacterResponseModel',
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          id: { type: apigw.JsonSchemaType.STRING },
          characterName: { type: apigw.JsonSchemaType.STRING },
          episodes: { type: apigw.JsonSchemaType.ARRAY, items: { type: apigw.JsonSchemaType.STRING } },
          planet: { type: apigw.JsonSchemaType.STRING }
        },
      }
    });

    this.apiModels['CharacterListResponseModel'] = this.restApi.addModel('CharacterListResponseModel', {
      contentType: 'application/json',
      modelName: 'CharacterListResponseModel',
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          characters: {
            type: apigw.JsonSchemaType.OBJECT, properties: {
              id: { type: apigw.JsonSchemaType.STRING },
              characterName: { type: apigw.JsonSchemaType.STRING },
              episodes: { type: apigw.JsonSchemaType.ARRAY, items: { type: apigw.JsonSchemaType.STRING } },
              planet: { type: apigw.JsonSchemaType.STRING }
            }
          },
          lastEvaluatedKey: {
            type: apigw.JsonSchemaType.OBJECT, properties: {
              id: { type: apigw.JsonSchemaType.STRING }
            }
          }

        },
      }
    });

    this.apiModels['CharacterUpdateModel'] = this.restApi.addModel('CharacterUpdateModel', {
      contentType: 'application/json',
      modelName: 'CharacterUpdateModel',
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          characterName: { type: apigw.JsonSchemaType.STRING },
          episodes: { type: apigw.JsonSchemaType.ARRAY, items: { type: apigw.JsonSchemaType.STRING } },
          planet: { type: apigw.JsonSchemaType.STRING }
        },
      }
    });

    this.apiModels['CharacterCreateModel'] = this.restApi.addModel('CharacterCreateModel', {
      contentType: 'application/json',
      modelName: 'CharacterCreateModel',
      schema: {
        schema: apigw.JsonSchemaVersion.DRAFT4,
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          characterName: { type: apigw.JsonSchemaType.STRING },
          episodes: { type: apigw.JsonSchemaType.ARRAY, items: { type: apigw.JsonSchemaType.STRING } },
          planet: { type: apigw.JsonSchemaType.STRING }
        },
        required: ["id", "characterName", "episodes"]
      }
    })
  }

  private createRestApiEndpoints() {
    const charactersApiRoot = this.restApi.root.addResource('character');

    this.createCreateEntryEndpoint(charactersApiRoot);
    this.createGetEntriesEndpoint(charactersApiRoot);

    const singleCharacterApiResource = charactersApiRoot.addResource('{id}');

    this.createDeleteEndpoint(singleCharacterApiResource);
    this.createEditEndpoint(singleCharacterApiResource);
    this.createGetEntryEndpoint(singleCharacterApiResource);
  }

  private createGetEntryEndpoint(singleCharacterApiResource: cdk.aws_apigateway.Resource) {
    const getEntryFunc = new lambda.NodejsFunction(this, 'getEntryFunction', {
      entry: './lib/get-entry.ts',
      environment: this.defaultLambdaEnv
    });
    this.charactersTable.grantReadData(getEntryFunc);
    singleCharacterApiResource.addMethod('GET', new apigw.LambdaIntegration(getEntryFunc), {
      requestParameters: {
        'method.request.path.id': true
      },
      methodResponses: [
        {
          statusCode: '404',
          responseModels: {
            'application/json': this.apiModels['BareStringResponseModel']
          }
        },
        {
          statusCode: '200',
          responseModels: {
            'application/json': this.apiModels['CharacterResponseModel']
          }
        }
      ]
    });
  }

  private createEditEndpoint(singleCharacterApiResource: cdk.aws_apigateway.Resource) {
    const editEntryFunc = new lambda.NodejsFunction(this, 'editEntryFunction', {
      entry: './lib/edit-entry.ts',
      environment: this.defaultLambdaEnv
    });
    this.charactersTable.grantReadWriteData(editEntryFunc);
    singleCharacterApiResource.addMethod('PATCH', new apigw.LambdaIntegration(editEntryFunc), {
      requestParameters: {
        'method.request.path.id': true
      },
      requestModels: {
        'application/json': this.apiModels['CharacterUpdateModel']
      },
      methodResponses: [
        {
          statusCode: '400',
          responseModels: {
            'application/json': this.apiModels['BareStringResponseModel']
          }
        },
        {
          statusCode: '200',
          responseModels: {
            'application/json': this.apiModels['CharacterResponseModel']
          }
        }
      ]
    });
  }

  private createDeleteEndpoint(singleCharacterApiResource: cdk.aws_apigateway.Resource) {
    const deleteEntryFunc = new lambda.NodejsFunction(this, 'deleteEntryFunction', {
      entry: './lib/delete-entry.ts',
      environment: this.defaultLambdaEnv
    });
    this.charactersTable.grantReadWriteData(deleteEntryFunc);
    singleCharacterApiResource.addMethod('DELETE', new apigw.LambdaIntegration(deleteEntryFunc), {
      requestParameters: {
        'method.request.path.id': true
      },
      methodResponses: [
        {
          statusCode: '400',
          responseModels: {
            'application/json': this.apiModels['BareStringResponseModel']
          }
        },
        {
          statusCode: '200',
          responseModels: {
            'application/json': this.apiModels['BareStringResponseModel']
          }
        }
      ]
    });
  }

  private createGetEntriesEndpoint(charactersApiRoot: cdk.aws_apigateway.Resource) {
    const getCollectionEntryFunc = new lambda.NodejsFunction(this, 'getCollectionFunction', {
      entry: './lib/get-collection.ts',
      environment: this.defaultLambdaEnv
    });
    this.charactersTable.grantReadWriteData(getCollectionEntryFunc);
    charactersApiRoot.addMethod('GET', new apigw.LambdaIntegration(getCollectionEntryFunc), {
      requestParameters: {
        'method.request.querystring.lastEvaluatedKey': false
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': this.apiModels['CharacterListResponseModel']
          }
        }
      ]
    });
  }

  private createCreateEntryEndpoint(charactersApiRoot: cdk.aws_apigateway.Resource) {
    const createEntryFunc = new lambda.NodejsFunction(this, 'createEntryFunction', {
      entry: './lib/create-entry.ts',
      environment: this.defaultLambdaEnv
    });
    this.charactersTable.grantReadWriteData(createEntryFunc);
    charactersApiRoot.addMethod('PUT', new apigw.LambdaIntegration(createEntryFunc), {
      requestModels: {
        'application/json': this.apiModels['CharacterCreateModel']
      },
      methodResponses: [
        {
          statusCode: '400',
          responseModels: {
            'application/json': this.apiModels['BareStringResponseModel']
          }
        },
        {
          statusCode: '200',
          responseModels: {
            'application/json': this.apiModels['CharacterResponseModel']
          }
        }
      ]
    });
  }

  private createRestApi() {
    this.restApi = new apigw.RestApi(this, 'StarWarsApi', {
      restApiName: 'StarWarsApi'
    });
  }

  private createCharactersTable() {
    this.charactersTable = new dynamo.Table(this, 'Characters', {
      partitionKey: { name: 'id', type: dynamo.AttributeType.STRING },
      readCapacity: 1,
      writeCapacity: 1
    });
    this.charactersTable.addGlobalSecondaryIndex({
      indexName: "NameIndex",
      partitionKey: { name: 'characterName', type: dynamo.AttributeType.STRING }
    });
    this.defaultLambdaEnv['CHARACTERS_TABLE_NAME'] = this.charactersTable.tableName;
  }
}
