# Honoken API - Posting.sh Collection

This directory contains the Honoken API collection (for the Passcreator service) converted from Postman to Posting.sh format.

## What is Posting.sh?

Posting is a modern, terminal-based API client that stores requests as simple YAML files. Unlike Postman, it's:

- Lightweight and fast
- Version control friendly (plain text YAML files)
- Keyboard-driven
- Open source

Learn more: https://posting.sh

## Installation

Install Posting using uv (recommended):

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Posting
uv tool install --python 3.12 posting
```

Or using pipx:

```bash
pipx install posting
```

## Using This Collection

Load the collection in Posting:

```bash
posting --collection honoken
```

## Collection Structure

The collection has been organized into folders matching the original Postman structure:

- **pass_templates/** - Pass template management endpoints
- **passes/** - Pass management endpoints
  - **update_passes/** - Update pass operations
  - **retreive_information/** - Get pass information
  - **pass_bundles/** - Bundle management
- **rest_hooks/** - Webhook configuration
- **validating_passes/** - Pass validation endpoints

## Environment Variables

The collection uses these variables (in `{{variable}}` format):

- `{{honoken_api_base_uri}}` - Base API URL
- `{{honoken_api_key}}` - API key for authentication
- `{{honoken_template_identifier}}` - Template ID
- `{{honoken_pass_identifier}}` - Pass ID
- `{{honoken_passTypeId}}` - Pass type ID
- `{{honoken_notification_identifier}}` - Notification ID
- `{{honoken_bundle_identifier}}` - Bundle ID
- `{{honoken_recipientMail}}` - Email recipient
- `{{honoken_appconfiguration_identifier}}` - App configuration ID

**Note:** Posting.sh handles environment variables differently than Postman. You'll need to:

1. Either replace the `{{variable}}` placeholders with actual values in each file
2. Or use Posting's environment/variable system (check the documentation)

## Authentication

The collection uses API key authentication with the header:

```
Authorization: {{honoken_api_key}}
```

You'll need to add this header to requests that require authentication, or configure it globally in Posting.

## File Format

Each request is stored as a `.posting.yaml` file with this structure:

```yaml
name: Request Name
description: Optional description
method: GET
url: https://api.example.com/endpoint
headers:
  - name: Content-Type
    value: application/json
params:
  - name: queryParam
    value: value
body:
  content: |
    {
      "key": "value"
    }
  type: json
```

## Tips

- Use `Ctrl+J` to send a request
- Use `Ctrl+S` to save changes
- Use `Ctrl+N` to create a new request
- Press `F1` in any widget to see available shortcuts
- The collection browser supports folder navigation with `Shift+J` and `Shift+K`

## Converting Other Postman Collections

The conversion script is included: `convert_to_posting.py`

Usage:

```bash
python convert_to_posting.py <postman_collection.json> [output_dir]
```

Requirements:

```bash
pip install pyyaml
```

## Further Reading

- [Posting.sh Documentation](https://posting.sh/guide/)
- [Passcreator API Documentation](https://www.passcreator.com/en-us/documentation/api)
