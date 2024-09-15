const { startToyService } = require('../../service/ToyService');
const { startToyRepository } = require('../../repository/ToyRepository');
const { ERROR_TOY } = require('../../utils/Constants');

const mockToys = [
    { id: 1, name: 'Toy 1', catId: 1 },
    { id: 2, name: 'Toy 2', catId: 2 },
    { id: 3, name: 'Toy 3', catId: 1 },
    { id: 4, name: 'Toy 4', catId: 3 },
    { id: 5, name: 'Toy 5', catId: 2 }
];

jest.mock('../../repository/ToyRepository');

startToyRepository.mockReturnValue({
    getAll: jest.fn().mockResolvedValue(mockToys),
    getCount: jest.fn().mockResolvedValue(mockToys.length),
    getById: jest.fn().mockImplementation((id) => {
        const toy = mockToys.find(toy => toy.id === id);
        return toy ? toy : ERROR_TOY;
    }),
    add: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn()
});

describe('getAllToys', () => {
    it('returns all toys from the repository', async () => {
        const service = startToyService();
        const result = await service.getAllToys();
        expect(result).toEqual(mockToys);
    });
});

describe('getToyCount', () => {
    it('returns the count of toys from the repository', async () => {
        const service = startToyService();
        const result = await service.getToyCount();
        expect(result).toEqual(mockToys.length);
    });
});

describe('getToyById', () => {
    it('returns the toy with the given id from the repository', async () => {
        const service = startToyService();
        const result = await service.getToyById(3);
        expect(result).toEqual(mockToys[2]);
    });

    it('returns error toy if id is not a number', async () => {
        const service = startToyService();
        const result = await service.getToyById("string");
        expect(result).toEqual(ERROR_TOY);
    });
});

describe('addToy', () => {
    it('adds a toy to the repository', async () => {
        const service = startToyService();
        const newToy = { name: 'New Toy', catId: 1 };

        const result = await service.addToy(newToy);

        expect(result).toEqual(true);
        expect(startToyRepository().add).toHaveBeenCalledWith(newToy);
    });

    it('returns false if catId is not a number', async () => {
        const service = startToyService();

        const result = await service.addToy({ name: 'New Toy', catId: "string" });

        expect(result).toEqual(false);
    });
});

describe('updateToy', () => {
    it('updates a toy in the repository', async () => {
        const service = startToyService();
        const updatedToy = { name: 'Updated Toy', catId: 2 };

        const result = await service.updateToy(2, updatedToy);

        expect(result).toEqual(true);
        expect(startToyRepository().update).toHaveBeenCalledWith(2, updatedToy);
    });

    it('returns false if catId is not a number', async () => {
        const service = startToyService();
        const result = await service.updateToy(2, { name: 'Updated Toy', catId: "string" });
        expect(result).toEqual(false);
    });
});

describe('deleteToy', () => {
    it('deletes a toy from the repository', () => {
        const service = startToyService();
        service.deleteToy(2);
        expect(startToyRepository().deleteById).toHaveBeenCalledWith(2);
    });
});
