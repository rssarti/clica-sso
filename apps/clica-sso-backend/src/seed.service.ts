import { Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
export class SeedService {
  constructor(private readonly usersService: UsersService) {}

  async seedUsers() {
    const users = [
      {
        email: 'admin@clica.com',
        password: '123456',
        name: 'Administrador',
        document: '00000000000',
        phone: '(11) 99999-9999',
        address: 'Endereço Admin',
        metadata: { role: 'admin' },
      },
      {
        email: 'user@clica.com',
        password: '123456',
        name: 'Usuário Teste',
        document: '11111111111',
        phone: '(11) 88888-8888',
        address: 'Endereço User',
        metadata: { role: 'user' },
      },
      {
        email: 'cliente@clica.com',
        password: '123456',
        name: 'Cliente Exemplo',
        document: '22222222222',
        phone: '(11) 77777-7777',
        address: 'Endereço Cliente',
        metadata: { role: 'client' },
      },
    ];

    for (const userData of users) {
      try {
        const existingUser = await this.usersService.findByEmail(
          userData.email,
        );
        if (!existingUser) {
          await this.usersService.create(userData);
          console.log(`Usuário ${userData.email} criado com sucesso`);
        } else {
          console.log(`Usuário ${userData.email} já existe`);
        }
      } catch (error) {
        console.error(`Erro ao criar usuário ${userData.email}:`, error);
      }
    }
  }
}
