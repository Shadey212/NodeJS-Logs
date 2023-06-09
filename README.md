# Node.js Log Generator

This is a Node.js application that generates random log messages and sends them to a logging service for further analysis and storage. It provides a simple API endpoint to start and stop log generation, and a web interface to control log generation and view the number of logs generated in real-time.

## Prerequisites

- Node.js (v18.16.0 or higher)
- NPM (Node Package Manager)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/nodejs-log-generator.git
   cd nodejs-log-generator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your logging service:

   - Choose and set up your preferred logging service. Examples include Logtail, Loggly, Papertrail, etc.
   - Obtain the necessary credentials or tokens required to access the logging service.

4. Set up environment variables:

   - Depending on your chosen logging service, you may need to set specific environment variables for authentication or configuration. Refer to the documentation of your logging service for details.
   - For Logtail, set the `LOGTAIL_SOURCE_TOKEN` environment variable with your Logtail source token. You can either set it directly in the `.env` file or as an environment variable in your deployment environment.

5. Start the application:

   ```bash
   npm start
   ```

6. Open your browser and visit `http://localhost:3000` to access the log generator interface.

## Usage

- Click on the "Start Generating Logs" button to start generating random logs.
- Click on the "Stop Generating Logs" button to stop log generation.
- The "Total Logs Generated" counter will display the number of logs generated in real-time.

## Using a Different Logging Service

- This log generator is flexible and can be adapted to work with various logging services.
- To use a different logging service, follow these steps:
  1. Replace the code that interacts with the specific logging service in the `logtail.config.js` file with the necessary code for your chosen service.
  2. Adjust any required configuration or environment variables according to your logging service's requirements.
  3. Update the instructions in this README file to reflect the changes and provide guidance specific to your chosen logging service.

## License

This project is licensed under the [MIT License](LICENSE).
```
