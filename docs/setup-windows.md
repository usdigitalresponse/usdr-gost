# Setup - Windows

See below for how to set up your development environment in Windows.

* Requires: *Some Linux command line knowledge*  
* Takes: *A few hours depending on your machine and network connection (more if you hit errors). Requires multiple reboots.*

## Prerequisites

1. [Install Windows Subsystem for Linux](https://github.com/usdigitalresponse/usdr-gost/wiki/How-to-create-an-Ubuntu-instance-in-Windows-Subsystem-for-Linux)  

1. Install Docker Desktop for Windows
   * See instructions [here](https://docs.docker.com/desktop/install/windows-install/)
     * *Might want to read the system requirements*
   * Take defaults
   * Run Docker Desktop and accept license.
   * Let it start.
   * Verify in (restarted) Ubuntu terminal:  

     ```sh
     $ docker --version
     Docker version 20.10.17, build 100c701
     ```

1. Install (and run) Visual Studio Code
   * Instructions [here](https://code.visualstudio.com/docs/remote/wsl)

1. Run `git clone` as described in [platform-independent steps](https://github.com/usdigitalresponse/usdr-gost/wiki/Platform-independent-install-instructions).

1. Run the rest of the steps in [platform-independent steps](https://github.com/usdigitalresponse/usdr-gost/wiki/Platform-independent-install-instructions).

## Notes

* After rebooting, you might have to run the Docker Desktop to start the Docker daemon (or add it to your startup as described [here](https://support.microsoft.com/en-us/windows/add-an-app-to-run-automatically-at-startup-in-windows-10-150da165-dcd9-7230-517b-cf3c295d89dd)).
