# Open In DiffTool

Select two files from the Explorer to compare differences.

## Features

- You can launch an external diff tool to check the differences between files.
- Use WinMerge as default diff tool.

## Usage

1. Select multiple files with `Ctrl+click`, etc.
2. Select `openindifftool.GetDiff` from the context menu.
3. The diff tool you set up will show you the differences.

![Image](./resources/img/openindifftoolSample.gif)

## Config

- `openindifftool.diffTool` : Path to the diff tool executable (default :`WinMergeU.exe`)

## Requirements

- Visual Studio Code 1.38.0 or newer

## License

Licensed under MIT
