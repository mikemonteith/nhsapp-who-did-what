curl -X POST -d '{
  "files": [
    {
      "name": "/.azuredevops/templates/file1.yml"
    },
    {
      "name": "/backend-worker/test/somefile.cs"
    }
  ],
  "commit_url": "https://some.url.com",
  "repo": "nhsapp",
  "user": "madu62@hscic.gov.uk"
}' \
http://localhost:7071/api/devopsTrigger
