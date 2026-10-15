# Library discovery and the shared major.minor check, sourced by the release workflows.
# Port of the .monorepo-scripts template from ci-toolbox/monorepo-library@2. POSIX sh: the
# toolbox image is Alpine.

# Sets LIBS to every top-level directory with its own pydev config - what makes it a versioned unit.
list_libs() {
  LIBS=""
  for dir in */; do
    dir="${dir%/}"
    if [ -f "$dir/.pydev/base.yml" ] || [ -f "$dir/.pydev/base.conf" ]; then
      LIBS="$LIBS $dir"
    fi
  done
  [ -n "$LIBS" ] || { echo "ERROR: no libraries found (no <dir>/.pydev config)"; exit 1; }
  echo "libraries:$LIBS"
}

# Sets PRE_LIBS to the libraries on a pre-release. With SHARED_MINOR_MAJOR it also requires one
# major.minor across all libraries and either all or none of them on a pre-release: pydev can only
# bump, not set a version, so CI could never bring a drifted library back in line.
check_shared_minor_major() {
  PRE_LIBS=""
  STABLE_LIBS=""
  MINOR_MAJORS=""
  for lib in $LIBS; do
    v=$(cd "$lib" && pydev version print)
    MINOR_MAJORS="$MINOR_MAJORS $(echo "$v" | cut -d. -f1,2)"
    case "$v" in
      *-alpha.*|*-beta.*|*-rc.*) PRE_LIBS="$PRE_LIBS $lib" ;;
      *) STABLE_LIBS="$STABLE_LIBS $lib" ;;
    esac
  done
  [ "${SHARED_MINOR_MAJOR:-}" = "true" ] || return 0

  if [ "$(echo $MINOR_MAJORS | tr ' ' '\n' | sort -u | wc -l)" -ne 1 ]; then
    echo "ERROR: SHARED_MINOR_MAJOR is on, but the libraries are on different major.minor versions:"
    for lib in $LIBS; do echo "  $lib: $(cd "$lib" && pydev version print)"; done
    echo "Align their version files to one major.minor in a pull request to ${NEXT_BRANCH:-next}."
    exit 1
  fi
  if [ -n "$PRE_LIBS" ] && [ -n "$STABLE_LIBS" ]; then
    echo "ERROR: SHARED_MINOR_MAJOR is on, but only some libraries are on a pre-release:"
    echo "  pre-release:$PRE_LIBS"
    echo "  stable:$STABLE_LIBS"
    echo "Put all of them on the same pre-release in a pull request to ${NEXT_BRANCH:-next}."
    exit 1
  fi
}
