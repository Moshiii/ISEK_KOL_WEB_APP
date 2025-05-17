
# Isek: Distributed Multi-Agent Framework

Isek is a distributed multi-agent framework designed to provide flexible and efficient agent management and distributed computing capabilities. You can easily manage and run your Isek project through simple command-line operations, including running agents and setting configurations.

## Installation

### Install with Hatch

First, ensure you have the [Hatch](https://hatch.pypa.io/) tool installed. If not, you can install it with the following command:

```bash
pip install hatch
```

Then, use Hatch to install the project dependencies:

```bash
hatch install
```

This will automatically install all required dependencies and set up the environment for you.

### Dependencies

The necessary dependencies are listed in the `pyproject.toml`, and Hatch will handle the installation of these dependencies.

## Usage

### Running the Isek Project

### Examples

To run the Isek registry with default configuration file use the following command:

```bash
isek run registry
```

Load a specified configuration file.
- **`--config`**: Specifies the path to the configuration file.

```bash
isek run registry --config custom_config.yaml
```



To run single agent example.

```bash
isek run agent
```

To run multi-agent example.

```bash
isek run agents
```

### Cleaning Cache Files

To clean up Python cache files (e.g., `__pycache__`), run the following command:

```bash
isek clean
```

## Project Structure

Here’s the basic structure of the project:

```
isek/
├── isek.py                    # Main entry point for Isek framework
├── config/                     # Configuration files directory
│   └── default.yaml            # Default configuration file
├── agents/                     # Agent-related code
│   └── agent1.py               # Implementation of agent1
├── requirements.txt            # List of dependencies
├── pyproject.toml              # Project configuration
└── README.md                   # Project documentation
```

## Contributing

If you’d like to contribute to the Isek project, you can follow these steps:

1. Fork this repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add feature'`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. For more details, please refer to the [LICENSE](LICENSE) file.
