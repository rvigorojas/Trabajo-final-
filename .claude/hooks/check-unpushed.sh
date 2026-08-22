#!/usr/bin/env bash
# SessionStart hook: reemplaza la lectura manual del punto "Antes de responder nada"
# de ~/.claude/commands/proyecto.md (revisar git log origin/main..HEAD al empezar).
cd "C:\Users\ASUS\Desktop\Nueva carpeta\DMC\Proyecto final\Trabajo-final-" 2>/dev/null

UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null)

if [ -z "$UNPUSHED" ]; then
  printf '%s' '{"systemMessage":"PCE Jorge Chavez: repo al dia con origin/main, sin commits locales sin pushear."}'
else
  NL=$'\n'
  BSN='\n'
  Q='"'
  BSQ='\"'
  T="${UNPUSHED//$NL/$BSN}"
  T="${T//$Q/$BSQ}"
  printf '%s' "{\"systemMessage\":\"PCE Jorge Chavez: hay commits locales SIN pushear a origin/main:\\n${T}\"}"
fi
