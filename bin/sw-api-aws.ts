#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SwApiAwsStack } from '../lib/sw-api-aws-stack';

const app = new cdk.App();
new SwApiAwsStack(app, 'SwApiAwsStack', {

});