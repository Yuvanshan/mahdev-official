import handler from '../../backend/api/handlers/careers/application.js';

export default function careerApplication(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
