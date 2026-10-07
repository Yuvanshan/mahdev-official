import { hashAdminPassword } from '../server/adminCredentialAuth';

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  throw new Error('Run this command in an interactive terminal so the password is not echoed.');
}

process.stdout.write('Enter a new admin password (minimum 12 characters): ');
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

let password = '';
const cleanup = () => {
  process.stdin.setRawMode(false);
  process.stdin.pause();
};

process.stdin.on('data', (input: string) => {
  for (const character of input) {
    if (character === '\u0003') {
      cleanup();
      process.stdout.write('\nCancelled.\n');
      process.exit(130);
    }
    if (character === '\r' || character === '\n') {
      cleanup();
      process.stdout.write('\n');
      try {
        process.stdout.write(`ADMIN_LOGIN_PASSWORD_HASH=${hashAdminPassword(password)}\n`);
      } catch (error) {
        console.error(error instanceof Error ? error.message : 'Could not create password hash.');
        process.exitCode = 1;
      } finally {
        password = '';
      }
      return;
    }
    if (character === '\u007f' || character === '\b') {
      password = password.slice(0, -1);
    } else {
      password += character;
    }
  }
});
