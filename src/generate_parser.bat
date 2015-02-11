@echo off

call "C:\Program Files (x86)\nodejs\nodevars.bat"
echo.
echo Generating parser...
call jison grammar.jison
echo Done
echo.
