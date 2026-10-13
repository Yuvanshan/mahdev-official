import handler from '../../backend/api/handlers/careers/status.js';

export default function careerStatus(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
