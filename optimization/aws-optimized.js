
// AWS SDK Otimizado - Apenas serviços necessários
export { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
export { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
export { SSOClient } from '@aws-sdk/client-sso';

// Remover AWS SDK v2 completo (40K+ linhas)
// Usar apenas clients específicos v3 (economia ~85%)
