const { startCatService } = require('../../service/CatService');
const { startCatRepository } = require('../../repository/CatRepository');
const { beforeEach } = require('node:test');
const { ERROR_CAT } = require('../../utils/Constants');

const mockCats = [
    { id: 1, name: 'Cat 1', age: 3, weight: 5 },
    { id: 2, name: 'Cat 2', age: 4, weight: 6 },
    { id: 3, name: 'Cat 3', age: 2, weight: 4 },
    { id: 4, name: 'Cat 4', age: 5, weight: 7 },
    { id: 5, name: 'Cat 5', age: 6, weight: 8 }
];

jest.mock('../../repository/CatRepository');
startCatRepository.mockReturnValue({
    getAllSortedPaginated: jest.fn().mockResolvedValue(mockCats),
    getAll: jest.fn().mockResolvedValue(mockCats),
    getById: jest.fn().mockResolvedValue({ name: 'Mary', age: 22, weight: 10 }),
    add: jest.fn(),
    getCount: jest.fn().mockResolvedValue(mockCats.length),
    deleteById: jest.fn().mockResolvedValue(3),
    getUsersFavoriteBreedById: jest.fn().mockResolvedValue("tabby"),
    toysPerCat: jest.fn().mockResolvedValue([{ cat: { name: "Mary", age: 3, weight: 2.2 }, count: 6 }]),
    getAgeDistribution: jest.fn().mockResolvedValue([{ age: 2, count: 3 }, { age: 5, count: 7 }]),
    update: jest.fn()
});

describe('getAllCatsSortedAndPaginated', () => {
    it('returns cats sorted and paginated if page and direction provided', async () => {
        const pageNumber = 1;
        const sortByNameDirection = 'asc';

        const service = startCatService();
        const result = await service.getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber);

        expect(result).toEqual(mockCats);
        expect(startCatRepository().getAllSortedPaginated).toHaveBeenCalledWith(1, 1, 5);
    });

    it('returns all the cats in the repository if page=0', async () => {
        const pageNumber = 0;
        const sortByNameDirection = 'asc';

        const service = startCatService();
        const result = await service.getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber);

        expect(result).toEqual(mockCats);
        expect(startCatRepository().getAll).toHaveBeenCalledWith();
    });

    it('returns cats sorted descending if direction=desc', async () => {
        const pageNumber = 2;
        const sortByNameDirection = 'desc';

        const service = startCatService();
        const result = await service.getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber);

        expect(startCatRepository().getAllSortedPaginated).toHaveBeenCalledWith(-1, 6, 10);
    });
});

describe('getCatById test', () => {
    it('returns error cat if id is not a number', async () => {
        const service = startCatService();

        const result = await service.getCatById("string");

        expect(result).toEqual(ERROR_CAT);
    });

    it('returns the cat with that id from the repo if id is a number', async () => {
        const service = startCatService();

        const result = await service.getCatById(4);

        expect(startCatRepository().getById).toHaveBeenCalledWith(4);
    });
});

describe('addCat test', () => {
    it('returns false if age is not a number', async () => {
        const service = startCatService();

        const result = await service.addCat({ name: "a", age: "b", weight: 3 });

        expect(result).toEqual(false);
    });

    it('returns false if weight is not a number', async () => {
        const service = startCatService();

        const result = await service.addCat({ name: "a", age: 5, weight: "as" });

        expect(result).toEqual(false);
    });

    it('adds to repo and returns true if cat is valid', async () => {
        const service = startCatService();

        const result = await service.addCat({ name: "a", age: 5, weight: 1.7 });

        expect(result).toEqual(true);
        expect(startCatRepository().add).toHaveBeenCalledWith({ name: "a", age: 5, weight: 1.7 });
    })
});


describe('updateCat', () => {
    it('returns false if age is not a number', async () => {
        const service = startCatService();

        const result = await service.updateCat(1, { name: "a", age: "b", weight: 3 });

        expect(result).toEqual(false);
    });

    it('returns false if weight is not a number', async () => {
        const service = startCatService();

        const result = await service.updateCat(1, { name: "a", age: 5, weight: "as" });

        expect(result).toEqual(false);
    });

    it('updates in repo and returns true if cat is valid', async () => {
        const service = startCatService();

        const result = await service.updateCat(1, { name: "a", age: 5, weight: 1.7 });

        expect(result).toEqual(true);
        expect(startCatRepository().update).toHaveBeenCalledWith(1, { name: "a", age: 5, weight: 1.7 });
    })
});

describe('functions which just call a repo function', () => {
    it('getCatCount returns the number of cats in the repo', async () => {
        const service = startCatService();

        const result = await service.getCatCount();

        expect(result).toEqual(mockCats.length);
        expect(startCatRepository().getCount).toHaveBeenCalled();
    });

    it('deleteCat deletes cat with that in repo', async () => {
        const service = startCatService();

        await service.deleteCat(3);

        expect(startCatRepository().deleteById).toHaveBeenCalledWith(3);
    });

    it('getUsersFavoriteBreed gets that user\'s favorite breed', async () => {
        const service = startCatService();

        const breed = await service.getUsersFavoriteBreed(12);

        expect(breed).toEqual("tabby");
        expect(startCatRepository().getUsersFavoriteBreedById).toHaveBeenCalledWith(12);
    });

    it('getToysPerCat returns the toys-per-cat data from the repo', async () => {
        const service = startCatService();

        const toysPerCat = await service.getToysPerCat(1);

        expect(toysPerCat).toEqual([{ cat: { name: "Mary", age: 3, weight: 2.2 }, count: 6 }]);
        expect(startCatRepository().toysPerCat).toHaveBeenCalledWith(1);
    });

    it('getCatAgeDistribution returns the age distribution from the repo', async () => {
        // [{age: 2, count: 3}, {age: 5, count: 7}]
        const service = startCatService();

        const ageDistribution = await service.getCatAgeDistribution();

        expect(ageDistribution).toEqual([{ age: 2, count: 3 }, { age: 5, count: 7 }]);
        expect(startCatRepository().getAgeDistribution).toHaveBeenCalled();
    });
});