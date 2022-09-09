import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class SwApiAwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const charactersTable = new dynamo.Table(this, 'Characters', {
      partitionKey: {name: 'name', type: dynamo.AttributeType.STRING},
      readCapacity: 1,
      writeCapacity: 1
    });

    const restApi = new apigw.RestApi(this, 'StarWarsApi', {
      restApiName: 'StarWarsApi'
    });

    const charactersApiRoot = restApi.root.addResource('character');

    const createEntryFunc = new lambda.NodejsFunction(this, 'createEntryFunction', {
      entry: './lib/create-entry.ts'
    });
    charactersTable.grantReadWriteData(createEntryFunc);
    charactersApiRoot.addMethod('PUT', new apigw.LambdaIntegration(createEntryFunc));

    const getCollectionEntryFunc = new lambda.NodejsFunction(this, 'getCollectionFunction', {
      entry: './lib/get-collection.ts'
    });
    charactersTable.grantReadWriteData(getCollectionEntryFunc);
    charactersApiRoot.addMethod('GET', new apigw.LambdaIntegration(getCollectionEntryFunc));

    const singleCharacterApiResource = charactersApiRoot.addResource('{name}');

    const deleteEntryFunc = new lambda.NodejsFunction(this, 'deleteEntryFunction', {
      entry: './lib/delete-entry.ts'
    });
    charactersTable.grantReadWriteData(deleteEntryFunc);
    singleCharacterApiResource.addMethod('DELETE', new apigw.LambdaIntegration(deleteEntryFunc));

    const editEntryFunc = new lambda.NodejsFunction(this, 'editEntryFunction', {
      entry: './lib/edit-entry.ts'
    });
    charactersTable.grantReadWriteData(editEntryFunc);
    singleCharacterApiResource.addMethod('PATCH', new apigw.LambdaIntegration(editEntryFunc));

    const getEntryFunc = new lambda.NodejsFunction(this, 'getEntryFunction', {
      entry: './lib/get-entry.ts'
    });
    charactersTable.grantReadData(getEntryFunc);
    singleCharacterApiResource.addMethod('GET', new apigw.LambdaIntegration(getEntryFunc));

  }
}
