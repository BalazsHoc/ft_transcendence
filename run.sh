#!/bin/sh
# set -eu to exit the script if any command fails or any variable is not set
# cd to the directory of the script
# exec make up to run the make file

set -eu
cd "$(dirname "$0")"
exec make up
