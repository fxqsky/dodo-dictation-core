# 哆哆听写核心代码

[打开网页体验](https://tools.sidro.link/dodo/) · [功能和适用场景](https://tools.sidro.link/study/)

这里是哆哆听写首批公开的 TypeScript 源码。你可以运行和改进词表解析、题库校验、练习命名、家长核对统计与错词复习逻辑。

```sh
npm ci
npm test
```

`npm run build` 将源码编译到 `dist/`。首批代码取自网页版使用的核心逻辑，公开版独立运行。网页版还包含界面、题库内容、OCR 和云端分享服务。

欢迎从具体问题开始，例如英文短语的分隔方式、背诵文本如何保留换行、错词重复练习后的状态变化。请使用自编示例描述问题。查看[贡献指南](CONTRIBUTING.md)。

源代码采用 [MIT](LICENSE)。
