const { startUserService } = require('../../service/UserService');
const { startUserRepository, errorUser } = require('../../repository/UserRepository');

const mockUsers = [
    { id: 1, name: 'User 1', email: 'user1@example.com', password: 'password1', role: 'admin' },
    { id: 2, name: 'User 2', email: 'user2@example.com', password: 'password2', role: 'user' },
    { id: 3, name: 'User 3', email: 'user3@example.com', password: 'password3', role: 'user' }
];

jest.mock('../../repository/UserRepository');

startUserRepository.mockReturnValue({
    getById: jest.fn().mockImplementation((id) => {
        const user = mockUsers.find(user => user.id === id);
        return user ? user : errorUser;
    }),
    getRolesName: jest.fn().mockResolvedValue('admin'),
    getAll: jest.fn().mockResolvedValue(mockUsers),
    add: jest.fn(),
    deleteById: jest.fn(),
    updateRole: jest.fn(),
    updateName: jest.fn(),
    addBasicUserInformation: jest.fn()
});

describe('getUsersRoleName', () => {
    it('returns the role name of the user', async () => {
        const service = startUserService();

        const result = await service.getUsersRoleName(1);

        expect(startUserRepository().getRolesName).toHaveBeenCalled();
        expect(result).toEqual('admin');
    });

    it('adds basic user information if user does not exist', async () => {
        const service = startUserService();
        await service.getUsersRoleName(100);
        expect(startUserRepository().addBasicUserInformation).toHaveBeenCalledWith(100);
    });
});

describe('getAllUsers', () => {
    it('returns all users', async () => {
        const service = startUserService();

        const result = await service.getAllUsers();

        expect(startUserRepository().getAll).toHaveBeenCalled();
        expect(result).toEqual(mockUsers);
    });
});

describe('addUser', () => {
    it('adds a user to the repository', () => {
        const service = startUserService();
        const newUser = { name: 'New User', email: 'newuser@example.com', password: 'password', role: 'user' };
        
        service.addUser(newUser);

        expect(startUserRepository().add).toHaveBeenCalledWith(
            { name: 'New User', email: 'newuser@example.com', password: 'password', roleName: 'user' }
        );
    });
});

describe('deleteUser', () => {
    it('deletes a user from the repository', () => {
        const service = startUserService();
        service.deleteUser(2);
        expect(startUserRepository().deleteById).toHaveBeenCalledWith(2);
    });
});

describe('updateUserRole', () => {
    it('updates the role of a user in the repository', () => {
        const service = startUserService();
        service.updateUserRole(2, 'admin');
        expect(startUserRepository().updateRole).toHaveBeenCalledWith(2, 'admin');
    });
});

describe('updateUserName', () => {
    it('updates the name of a user in the repository', () => {
        const service = startUserService();
        service.updateUserName(2, 'Updated User');
        expect(startUserRepository().updateName).toHaveBeenCalledWith(2, 'Updated User');
    });
});
