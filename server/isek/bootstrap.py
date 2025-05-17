import argparse
import os
import subprocess
import isek_center
from isek_config import IsekConfig


def run_registry():
    """Run the registry center"""
    isek_center.main()
    print("Running registry center...")


def run_agent(config_path):
    """Run the agent task"""
    config = IsekConfig(config_path)
    config.load_agent().build_server()
    print("Running agent...")


def clean():
    """Call a Shell script to clean cache"""
    script_path = os.path.join(os.path.dirname(__file__), "scripts/clean.sh")
    subprocess.run(["bash", script_path], check=True)


def main():
    """Main function to parse arguments and execute commands"""
    parser = argparse.ArgumentParser(description="ISEK Command Line Interface")
    
    subparsers = parser.add_subparsers(dest="command")

    # `isek run registry` or `isek run agent`
    run_parser= subparsers.add_parser("run", help="Run commands")
    run_parser.add_argument("subcommand", choices=["registry", "agent", "agents"], help="Run registry or agent")
    run_parser.add_argument("--config", type=str, default="default_config.yaml", help="Path to the TOML configuration file")


    # `isek clean` to clean Python cache files
    parser_clean = subparsers.add_parser("clean", help="Clean all Python cache files")
    parser_clean.set_defaults(func=clean)

    # Parse arguments and execute the corresponding command
    args = parser.parse_args()

    if args.command == "run":
        if args.subcommand == "registry":
            run_registry()
        elif args.subcommand == "agent":
            run_agent(args.config)
    elif args.command == "clean":
        args.func()  # Call the clean function
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
