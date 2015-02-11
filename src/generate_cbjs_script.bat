@echo off

copy api.js+grammar.js example.js
echo var code = ''>> example.js
for /f "delims=" %%i in (example.cbjsscript) do (
	echo + ' %%i \n' >> example.js
)
echo ; parser.parse(code)(); >> example.js
