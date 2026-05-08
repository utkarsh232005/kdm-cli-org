import Docker from 'dockerode';

let docker: Docker | null = null;

export const getDockerClient = (): Docker => {
  if (!docker) {
    docker = new Docker();
  }
  return docker;
};

export const checkDockerConnection = async (): Promise<{ connected: boolean; containerCount: number }> => {
  try {
    const client = getDockerClient();
    const info = await client.info();
    return {
      connected: true,
      containerCount: info.ContainersRunning || 0,
    };
  } catch (error) {
    return {
      connected: false,
      containerCount: 0,
    };
  }
};
