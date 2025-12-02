// test/app.e2e-spec.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/.env.test' });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Task Manager API - Full E2E Tests (Final Working Version)', () => {
  let app: INestApplication;
  let httpServer: any;

  const user1 = {
    email: 'user1@test.com',
    password: '12345678',
    name: 'User One',
  };

  const user2 = {
    email: 'user2@test.com',
    password: '12345678',
    name: 'User Two',
  };

  let token1: string;
  let token2: string;
  let taskId1: string;
  let taskId2: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    httpServer = app.getHttpServer();
  });

  // Clean database before running the suite
  beforeAll(async () => {
    const ds = app.get(DataSource);
    await ds.query(`DELETE FROM tasks`);
    await ds.query(`DELETE FROM users WHERE email LIKE '%@test.com'`);
  });

  describe('Authentication', () => {
    it('should register user1 → 201', async () => {
      const res = await request(httpServer)
        .post('/auth/register')
        .send(user1)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(user1.email);
      expect(res.body.name).toBe(user1.name);
      expect(res.body.password).toBeUndefined();
    });

    it('should reject duplicate email → 409', async () => {
      await request(httpServer).post('/auth/register').send(user1).expect(409);
    });

    it('should login user1 → 200 + token', async () => {
      const res = await request(httpServer)
        .post('/auth/login')
        .send({ email: user1.email, password: user1.password })
        .expect(200);

      token1 = res.body.access_token;
      expect(token1).toBeDefined();
    });

    it('should register and login user2', async () => {
      await request(httpServer).post('/auth/register').send(user2).expect(201);

      const res = await request(httpServer)
        .post('/auth/login')
        .send({ email: user2.email, password: user2.password })
        .expect(200);

      token2 = res.body.access_token;
      expect(token2).toBeDefined();
    });

    it('should reject wrong password → 401', async () => {
      await request(httpServer)
        .post('/auth/login')
        .send({ email: user1.email, password: 'wrong' })
        .expect(401);
    });
  });

  describe('Tasks CRUD - Ownership & Isolation', () => {
    it('user1 creates a task → 201', async () => {
      const res = await request(httpServer)
        .post('/tasks')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Learn NestJS',
          description: 'Write E2E tests',
        })
        .expect(201);

      taskId1 = res.body.id;
      expect(taskId1).toBeDefined();
      expect(res.body.status).toBe('OPEN');
    });

    it('user2 creates a task → 201', async () => {
      const res = await request(httpServer)
        .post('/tasks')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Deploy App',
          description: 'Push to production',
        })
        .expect(201);

      taskId2 = res.body.id;
      expect(taskId2).toBeDefined();
    });

    it('user1 sees only own tasks', async () => {
      const res = await request(httpServer)
        .get('/tasks')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Learn NestJS');
    });

    it('user2 sees only own tasks', async () => {
      const res = await request(httpServer)
        .get('/tasks')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Deploy App');
    });

    it('user1 can get own task → 200', async () => {
      await request(httpServer)
        .get(`/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
    });

    it('user1 cannot get user2 task → 404', async () => {
      await request(httpServer)
        .get(`/tasks/${taskId2}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });

    it('user1 updates own task → 200', async () => {
      await request(httpServer)
        .patch(`/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Master NestJS', status: 'IN_PROGRESS' })
        .expect(200);

      const res = await request(httpServer).get(`/tasks/${taskId1}`).set('Authorization', `Bearer ${token1}`);
      expect(res.body.title).toBe('Master NestJS');
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('invalid status → 400', async () => {
      await request(httpServer)
        .patch(`/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'WRONG' })
        .expect(400);
    });

    it('user1 cannot update user2 task → 404', async () => {
      await request(httpServer)
        .patch(`/tasks/${taskId2}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'hack' })
        .expect(404);
    });

    it('user1 deletes own task → 200', async () => {
      await request(httpServer)
        .delete(`/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200)
        .expect(res => expect(res.body.message).toBe('Task deleted successfully'));
    });

    it('user1 cannot delete user2 task → 404', async () => {
      await request(httpServer)
        .delete(`/tasks/${taskId2}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(404);
    });
  });

  describe('Unauthorized Access', () => {
    const routes = [
      { method: 'post' as const, url: '/tasks', body: { title: 'x', description: 'y' } },
      { method: 'get' as const, url: '/tasks' },
      { method: 'get' as const, url: '/tasks/any-id' },
      { method: 'patch' as const, url: '/tasks/any-id', body: {} },
      { method: 'delete' as const, url: '/tasks/any-id' },
    ];

    routes.forEach(({ method, url, body }) => {
      it(`blocks ${method.toUpperCase()} ${url} without token → 401`, async () => {
        const req = request(httpServer)[method](url);
        if (body) req.send(body);
        await req.expect(401);
      });
    });
  });

  afterAll(async () => {
    const ds = app.get(DataSource);
    await ds.destroy();
    await app.close();
  });
});