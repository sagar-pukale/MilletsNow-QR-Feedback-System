export const notFound = (_request, response) => {
    response.status(404).json({ error: 'Route not found' });
};
