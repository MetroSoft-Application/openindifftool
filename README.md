# Open In DiffTool

Select two files from the Explorer to compare differences.

## Features

- You can launch an external diff tool to check the differences between files.
- Use WinMerge as default diff tool.

## Usage1

1. Select multiple files with `Ctrl+click`, etc.
2. Select `openindifftool.GetDiff` from the context menu.
3. The diff tool you set up will show you the differences.

![Image](./resources/img/openindifftool.GetDiff.Sample.gif)

## Usage2

1. Select modified file In `Source Control`
2. Select `openindifftool.GetDiffWithScm` from the context menu.
3. The diff tool you set up will show you the differences.
4. [svn extensions](https://github.com/JohnstonCode/svn-scm) are also supported.

![Image](./resources/img/openindifftool.GetDiffWithScm.Sample.gif)

## Config

- `openindifftool.diffTool` : Path to the diff tool executable (default :`WinMergeU.exe`)

## Requirements

- Visual Studio Code 1.38.0 or newer

## License

Licensed under MIT
