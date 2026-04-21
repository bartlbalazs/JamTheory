swagger: "2.0"
info:
  title: "JamTheory API"
  description: "API Gateway for JamTheory Cloud Functions. Validates Firebase JWTs at the edge."
  version: "1.0.0"
host: "PLACEHOLDER"  # replaced by API Gateway at deploy time
schemes:
  - "https"
produces:
  - "application/json"

# ---------------------------------------------------------------------------
# Per-user rate limiting via API Gateway quota
# ---------------------------------------------------------------------------
x-google-management:
  metrics:
    - name: "generate-masterclass-requests"
      displayName: "Generate Masterclass Requests"
      valueType: INT64
      metricKind: DELTA
    - name: "regenerate-licks-requests"
      displayName: "Regenerate Licks Requests"
      valueType: INT64
      metricKind: DELTA
  quota:
    limits:
      - name: "generate-masterclass-limit"
        metric: "generate-masterclass-requests"
        unit: "1/min/{project}"
        values:
          STANDARD: 5
      - name: "regenerate-licks-limit"
        metric: "regenerate-licks-requests"
        unit: "1/min/{project}"
        values:
          STANDARD: 10

# ---------------------------------------------------------------------------
# Firebase JWT security definition
# ---------------------------------------------------------------------------
securityDefinitions:
  firebase:
    authorizationUrl: ""
    flow: "implicit"
    type: "oauth2"
    x-google-issuer: "https://securetoken.google.com/${project_id}"
    x-google-jwks_uri: "https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com"
    x-google-audiences: "${project_id}"

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
paths:

  # -------------------------------------------------------------------------
  # /generate-masterclass — POST
  # -------------------------------------------------------------------------
  /generate-masterclass:
    post:
      operationId: "generateMasterclass"
      summary: "Generate a full masterclass for a YouTube backing track"
      security:
        - firebase: []
      x-google-quota:
        metricCosts:
          "generate-masterclass-requests": 1
      x-google-backend:
        address: "${generate_masterclass_url}"
        jwt_audience: "${generate_masterclass_url}"
        deadline: 180.0
        protocol: h2
      parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
      responses:
        "200":
          description: "Masterclass payload or {needsChords: true}"
        "400":
          description: "Invalid argument"
        "401":
          description: "Unauthenticated"
        "404":
          description: "YouTube video not found"
        "500":
          description: "Internal error"
    options:
      operationId: "generateMasterclassCors"
      summary: "CORS preflight for /generate-masterclass"
      x-google-backend:
        address: "${generate_masterclass_url}"
        deadline: 30.0
        protocol: h2
      parameters:
        - in: header
          name: Origin
          type: string
        - in: header
          name: Access-Control-Request-Method
          type: string
        - in: header
          name: Access-Control-Request-Headers
          type: string
      responses:
        "200":
          description: "CORS preflight response"
          headers:
            Access-Control-Allow-Origin:
              type: string
            Access-Control-Allow-Methods:
              type: string
            Access-Control-Allow-Headers:
              type: string
            Access-Control-Max-Age:
              type: string

  # -------------------------------------------------------------------------
  # /regenerate-licks — POST
  # -------------------------------------------------------------------------
  /regenerate-licks:
    post:
      operationId: "regenerateLicks"
      summary: "Regenerate the 3 vocabulary licks for an existing track variant"
      security:
        - firebase: []
      x-google-quota:
        metricCosts:
          "regenerate-licks-requests": 1
      x-google-backend:
        address: "${regenerate_licks_url}"
        jwt_audience: "${regenerate_licks_url}"
        deadline: 120.0
        protocol: h2
      parameters:
        - in: body
          name: body
          required: true
          schema:
            type: object
      responses:
        "200":
          description: "Three new licks"
        "400":
          description: "Invalid argument"
        "401":
          description: "Unauthenticated"
        "404":
          description: "Track variant not found"
        "500":
          description: "Internal error"
    options:
      operationId: "regenerateLicksCors"
      summary: "CORS preflight for /regenerate-licks"
      x-google-backend:
        address: "${regenerate_licks_url}"
        deadline: 30.0
        protocol: h2
      parameters:
        - in: header
          name: Origin
          type: string
        - in: header
          name: Access-Control-Request-Method
          type: string
        - in: header
          name: Access-Control-Request-Headers
          type: string
      responses:
        "200":
          description: "CORS preflight response"
          headers:
            Access-Control-Allow-Origin:
              type: string
            Access-Control-Allow-Methods:
              type: string
            Access-Control-Allow-Headers:
              type: string
            Access-Control-Max-Age:
              type: string
