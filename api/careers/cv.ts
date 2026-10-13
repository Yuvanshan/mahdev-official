import handler from '../../backend/api/handlers/careers/cv.js';

export default function careerCv(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
