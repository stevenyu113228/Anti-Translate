import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/anti-translate.js',
      format: 'umd',
      name: 'AntiTranslate',
      sourcemap: true
    },
    {
      file: 'dist/anti-translate.min.js',
      format: 'umd',
      name: 'AntiTranslate',
      sourcemap: true,
      plugins: [terser()]
    },
    {
      file: 'dist/anti-translate.esm.js',
      format: 'es',
      sourcemap: true
    }
  ]
};
