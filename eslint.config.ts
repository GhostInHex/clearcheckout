import tseslint from 'typescript-eslint';
export default tseslint.config({
 linterOptions:{noInlineConfig:true,reportUnusedDisableDirectives:'error'},
 files:['**/*.ts','**/*.tsx'],
 languageOptions:{parser:tseslint.parser},
 plugins:{'@typescript-eslint':tseslint.plugin},
 rules:{
  '@typescript-eslint/no-explicit-any':'error',
  '@typescript-eslint/ban-ts-comment':['error',{'ts-ignore':true,'ts-nocheck':true,'ts-expect-error':true,'ts-check':false}],
  'no-restricted-syntax':['error','TSAsExpression','TSTypeAssertion','TSNonNullExpression'],
 },
});
