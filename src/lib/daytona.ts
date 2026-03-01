const DAYTONA_API_URL = 'https://api.daytona.io'

export interface DaytonaWorkspace {
  id: string
  url: string
  status: string
}

export async function createWorkspace(repoUrl?: string): Promise<DaytonaWorkspace> {
  const apiKey = process.env.DAYTONA_API_KEY
  if (!apiKey) throw new Error('DAYTONA_API_KEY not configured')

  const response = await fetch(`${DAYTONA_API_URL}/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      repository: repoUrl || 'https://github.com/daytonaio/sample-python',
      name: `living-papers-${Date.now()}`,
    }),
  })

  if (!response.ok) throw new Error(`Daytona API error: ${response.status}`)
  return response.json()
}

export async function getWorkspaceUrl(workspaceId: string): Promise<string> {
  const apiKey = process.env.DAYTONA_API_KEY
  if (!apiKey) throw new Error('DAYTONA_API_KEY not configured')

  const response = await fetch(`${DAYTONA_API_URL}/workspace/${workspaceId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })

  if (!response.ok) throw new Error(`Daytona API error: ${response.status}`)
  const workspace = await response.json()
  return workspace.url || workspace.previewUrl
}
