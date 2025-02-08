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
4. [svn extensions](https://marketplace.visualstudio.com/items?itemName=johnstoncode.svn-scm) are also supported.

![Image](./resources/img/openindifftool.GetDiffWithScm.Sample.gif)

## Usage3

1. Select a file in a text editor.
2. Select `openindifftool.GetDiffFromEditorTab` from the tab context menu.
3. Select `openindifftool.GetDiffFromEditorTab` from the tab context menu of the file to compare.
4. The diff tool you set up will show you the differences.

   **Tip**: `openindifftool.GetDiffFromEditorTab` supports comparing unsaved files.

![Image](./resources/img/openindifftool.GetDiffFromEditorTab.Sample.gif)

## Usage4

1. Select text in a text editor.
2. Select `openindifftool.GetDiffFromSelectedText` from the context menu.
3. Select another text to compare in the same way, or use `openindifftool.GetDiffFromEditorTab` from the tab context menu to compare with a file.
4. The diff tool you set up will show you the differences.

   **Tip**: Selected texts are temporarily saved as files for comparison.

![Image](./resources/img/openindifftool.GetDiffFromSelectedText.Sample.gif)

## Config

- `openindifftool.diffTool` : Path to the diff tool executable (default :`WinMergeU.exe`

## Requirements

- Visual Studio Code 1.38.0 or newer

## License

Licensed under MIT
