#! /bin/bash

# Defaults
next_version_release_year=$(TZ='UTC' date '+%Y')
next_version_release_number=1

if [[ $1 == 'test' ]]; then
    echo 'Running tests...' >&2
    dotest() {
        result=$(bash $0 "release/${1}" 2> /dev/null | tail -n 1)
        expect="${2}"
        if [[ $result != $expect ]]; then
            printf "Test failed:\n  Expected: $expect\n  Received: $result\n" >&2
            exit 1
        fi
    }
    dotest 'release/1234.987' "$next_version_release_year.1"
    dotest 'release/0.0' "$next_version_release_year.1"
    dotest 'release/0' "$next_version_release_year.1"
    dotest 'sometag' "$next_version_release_year.1"
    dotest "release/$next_version_release_year.1" "$next_version_release_year.2"
    dotest "release/$next_version_release_year.19" "$next_version_release_year.20"
    dotest "release/$next_version_release_year.399" "$next_version_release_year.400"
    echo 'Tests complete' >&2
    exit 0
fi

if [[ -z $1 ]]; then
    # Ensure tag history is available
    git fetch --prune --unshallow
    tag=$(git describe --tags --match='release/[0-9][0-9][0-9][0-9].[0-9]*' refs/heads/main)
else
    tag=$1
fi

regex='release\/([0-9]{4})\.([0-9]+)'
if [[ $tag =~ $regex ]]; then
    echo "Found tag for previous release: $tag" >&2
    prev_version_release_number="${BASH_REMATCH[2]}"
    echo "Previous version number: $prev_version_release_number" >&2
    if [[ $next_version_release_year == "${BASH_REMATCH[1]}" ]]; then
        ((next_version_release_number=prev_version_release_number+1))
    else
        echo "Ignoring previous version number because it pertains to a different year" >&2
    fi
else
    echo "Could not locate a previous release version" >&2
fi

next_version="$next_version_release_year.$next_version_release_number"
echo "Next version: $next_version" >&2
# Output result to stdout
printf "$next_version"
